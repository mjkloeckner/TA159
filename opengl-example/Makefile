CC := gcc
CLIBS := -lglfw -lGL
CFLAGS := -Wall -Wshadow -ansi -std=c99 -O3
SRCS := $(wildcard *.c)
OBJS := $(SRCS:.c=.o)

TARGET := opengl-example

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(CLIBS) 
	rm -f $(OBJS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@ 

clean:
	rm -f $(OBJS)
