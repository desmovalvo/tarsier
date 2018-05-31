FROM python:3
ADD . /

# install requirements
RUN pip3 install -r requirements.txt

# open the port and start the process
EXPOSE 8080
CMD python3 tarsier.py